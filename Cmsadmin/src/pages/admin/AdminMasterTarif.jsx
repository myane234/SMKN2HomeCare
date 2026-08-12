import { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaFileInvoiceDollar, FaArrowLeft, FaSave } from 'react-icons/fa';
import Pagination from '../../components/pagination';
import { getAllTarif, createTarifData, updateTarifData, deleteTarifData } from '../../data/masterTarifData';
import { getAllLayanan } from '../../data/layananData';
import { getAllKotaKabupaten } from '../../data/wilayahLayananData';
import Swal from 'sweetalert2';

export default function DataMasterTarif() {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'add' | 'edit'

  const [tarifList, setTarifList] = useState([]);
  const [layananList, setLayananList] = useState([]);
  const [kotaList, setKotaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter State
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected Item untuk Edit
  const [selectedTarif, setSelectedTarif] = useState(null);

  // Form State
  const [formNama, setFormNama] = useState('');
  const [formLayanan, setFormLayanan] = useState('');
  const [formKota, setFormKota] = useState('');
  const [formTarifPasien, setFormTarifPasien] = useState('');
  const [formPotonganPersenNakes, setFormPotonganPersenNakes] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [tarifRes, layananRes, kotaRes] = await Promise.all([
        getAllTarif().catch(() => []),
        getAllLayanan().catch(() => []),
        getAllKotaKabupaten().catch(() => [])
      ]);

      setTarifList(tarifRes);
      setLayananList(layananRes);
      setKotaList(kotaRes);
    } catch (err) {
      setErrorMsg('Gagal memuat data master tarif');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddForm = () => {
    setSelectedTarif(null);
    setFormNama('');
    setFormLayanan('');
    setFormKota('');
    setFormTarifPasien('');
    setFormPotonganPersenNakes('');
    setFormActive(true);
    setViewMode('add');
  };

  const handleOpenEditForm = (item) => {
    setSelectedTarif(item);
    setFormNama(item.nama_template || '');
    setFormLayanan((item.id_layanan ?? '').toString());
    setFormKota((item.id_kota ?? '').toString());
    setFormTarifPasien((item.tarif_pasien ?? '').toString());
    setFormPotonganPersenNakes((item.potongan_persen_nakes ?? '').toString());
    setFormActive(item.is_active !== undefined ? Boolean(item.is_active) : true);
    setViewMode('edit');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedTarif(null);
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
    return parseFloat(clean) || 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formLayanan) {
      Swal.fire('Error', 'Silakan pilih Layanan', 'error');
      setIsSubmitting(false);
      return;
    }

    const tarifPasienNum = parseFormattedNumber(formTarifPasien);
    const potonganNakesNum = parseInt(formPotonganPersenNakes) || 0;

    const payload = {
      nama_template: formNama,
      id_layanan: Number(formLayanan),
      id_kota: formKota ? Number(formKota) : null,
      tarif_pasien: tarifPasienNum,
      potongan_persen_nakes: potonganNakesNum,
      is_active: formActive
    };

    try {
      const idMaster = selectedTarif?.id_master_tarif || selectedTarif?.id;
      if (viewMode === 'edit' && idMaster) {
        await updateTarifData(idMaster, payload);
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
    const idMaster = item.id_master_tarif || item.id;
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
          await deleteTarifData(idMaster);
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
    return matchesSearch;
  });

  const totalPages = Math.max(Math.ceil(filteredTarif.length / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredTarif.slice(startIndex, startIndex + itemsPerPage);

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="max-w-4xl mx-auto pb-10">
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
            <h1 className="text-2xl font-bold text-slate-900">
              {viewMode === 'add' ? 'Tambah Template Master Tarif' : 'Edit Template Master Tarif'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Atur skema perhitungan tarif baru untuk tindakan medis atau layanan.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nama Template Tarif <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tarif Tindakan Medis Standar"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Layanan <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all bg-white"
                    value={formLayanan}
                    onChange={(e) => setFormLayanan(e.target.value)}
                    required
                  >
                    <option value="">Pilih Layanan</option>
                    {layananList.length > 0 ? (
                      layananList.map((lay) => (
                        <option key={lay.id} value={lay.id}>
                          {lay.nama}
                        </option>
                      ))
                    ) : (
                      <option disabled>Layanan Kosong</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Kota/Kabupaten <span className="text-slate-400">(Opsional / Default Nasional)</span>
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all bg-white"
                    value={formKota}
                    onChange={(e) => setFormKota(e.target.value)}
                  >
                    <option value="">Nasional / Default</option>
                    {kotaList.map((kota) => (
                      <option key={kota.id_kota} value={kota.id_kota}>
                        {kota.nama_kota}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Tarif Pasien (Rp) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all bg-slate-50/50"
                      value={formatDisplayNumber(formTarifPasien)}
                      onChange={(e) => setFormTarifPasien(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Potongan Hak Nakes (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all bg-slate-50/50"
                    value={formPotonganPersenNakes}
                    onChange={(e) => setFormPotonganPersenNakes(e.target.value)}
                    placeholder="Contoh: 80"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="tarif-status-checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                />
                <label htmlFor="tarif-status-checkbox" className="text-sm font-semibold text-slate-800 cursor-pointer">
                  Template Aktif (Bisa digunakan untuk Layanan)
                </label>
              </div>
            </div>

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
                <FaSave />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Template Tarif'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Master Tarif Blueprint</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola skema template perhitungan tarif dan bagi hasil hak nakes.</p>
        </div>
        <button onClick={handleOpenAddForm} className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm shadow-green-600/20 transition-all">
          <FaPlus />
          <span>Tambah Template Tarif</span>
        </button>
      </div>

      <div className="mb-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 flex-grow">
          <FaSearch className="text-slate-400" />
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
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
          {errorMsg}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="p-10 text-center text-sm text-slate-500">Memuat data master tarif...</p>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3.5">Nama Template / Layanan / Wilayah</th>
                  <th className="px-4 py-3.5 text-right">Tarif Pasien</th>
                  <th className="px-4 py-3.5 text-center">Bagi Hasil Nakes</th>
                  <th className="px-4 py-3.5 text-right">Biaya Admin</th>
                  <th className="px-4 py-3.5 text-center">PPN</th>
                  <th className="px-4 py-3.5 text-right">Subtotal</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-sm text-slate-400">
                      Tidak ada template tarif yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item) => {
                    const lay = layananList.find(l => Number(l.id) === Number(item.id_layanan));
                    const kota = kotaList.find(k => Number(k.id_kota) === Number(item.id_kota));
                    const idMaster = item.id_master_tarif || item.id;

                    return (
                      <tr key={idMaster} className="hover:bg-slate-50">
                        <td className="px-4 py-3.5">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200 mt-0.5">
                              <FaFileInvoiceDollar className="text-base" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{item.nama_template}</div>
                              <div className="text-xs text-slate-400 mt-0.5">ID Blueprint: #{idMaster}</div>
                              <div className="text-xs text-teal-600 font-medium mt-0.5">
                                Layanan: {lay ? lay.nama : `ID: ${item.id_layanan}`}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                Wilayah: {kota ? kota.nama_kota : 'Nasional (Default)'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-slate-800">
                          {formatRupiah(item.tarif_pasien)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="text-slate-800 font-medium">
                            {item.potongan_persen_nakes}%
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.fee_nakes_nominal ? formatRupiah(item.fee_nakes_nominal) : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-slate-800">
                          {formatRupiah(item.total_biaya_admin)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="font-semibold text-slate-700">{item.persen_ppn}%</div>
                          <div className="text-xs text-slate-500">({formatRupiah(item.total_ppn)})</div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-slate-900">
                          {formatRupiah(item.total_tarif_final || item.subtotal)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {item.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
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
                    );
                  })
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