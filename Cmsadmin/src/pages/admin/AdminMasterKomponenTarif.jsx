import React, { useState, useEffect, useMemo } from 'react';
import { 
  getAllKomponenTarif, 
  getTipeKomponenOptions,
  createKomponenTarif, 
  updateKomponenTarif, 
  deleteKomponenTarif 
} from '../../data/masterKomponenTarifData';
import Pagination from '../../components/pagination';
import { 
  FaSave, FaPlus, FaSearch, 
  FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaFilter
} from 'react-icons/fa';
import Swal from 'sweetalert2';

const AdminMasterKomponenTarif = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(''); // '' (semua), '1' (aktif), '0' (nonaktif)
  
  // State untuk opsi dari API /komponen-tarif/kategori
  const [tipeKomponenOptions, setTipeKomponenOptions] = useState([]);
  const [loadingTipe, setLoadingTipe] = useState(false);

  const [viewMode, setViewMode] = useState('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nama_komponen: '',
    tipe_komponen: '',
    jenis_nilai: 'persen',
    nilai: '',
    is_active: true
  });

  // Fetch Tipe Komponen dari GET /api/komponen-tarif/kategori
  const fetchTipeOptions = async () => {
    setLoadingTipe(true);
    try {
      const resData = await getTipeKomponenOptions();
      const options = resData?.tipe_komponen || [];
      setTipeKomponenOptions(options);

      if (options.length > 0 && !formData.tipe_komponen) {
        setFormData(prev => ({ ...prev, tipe_komponen: options[0].value }));
      }
    } catch (err) {
      console.error('Gagal mengambil opsi tipe komponen:', err);
    } finally {
      setLoadingTipe(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllKomponenTarif({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        kategori: selectedKategori,
        status: selectedStatus
      });

      if (response && Array.isArray(response.data)) {
        setData(response.data);
        setTotalPages(response.total_pages || response.last_page || Math.ceil((response.total || response.data.length) / itemsPerPage) || 1);
      } else if (Array.isArray(response)) {
        setData(response);
        setTotalPages(Math.max(Math.ceil(response.length / itemsPerPage), 1));
      } else {
        setData([]);
        setTotalPages(1);
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat data komponen tarif');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTipeOptions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, selectedKategori, selectedStatus]);

  // Fallback filtering di level client untuk memastikan data langsung ter-filter dengan responsif
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Filter Search Nama Komponen
      const matchSearch = searchTerm
        ? item.nama_komponen?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      // 2. Filter Tipe / Kategori Komponen
      const itemKategori = item.tipe_komponen || item.kategori;
      const matchKategori = selectedKategori
        ? itemKategori === selectedKategori
        : true;

      // 3. Filter Status (Aktif / Nonaktif)
      const isActive = item.is_active === true || item.is_active === 1 || item.status === 1 || item.status === 'aktif';
      const matchStatus = 
        selectedStatus === '' ? true :
        selectedStatus === '1' ? isActive :
        !isActive;

      return matchSearch && matchKategori && matchStatus;
    });
  }, [data, searchTerm, selectedKategori, selectedStatus]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Komponen?',
      text: 'Data yang dihapus tidak dapat dikembalikan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      try {
        await deleteKomponenTarif(id);
        Swal.fire('Terhapus!', 'Komponen berhasil dihapus.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Gagal!', err.message || 'Gagal menghapus data.', 'error');
      }
    }
  };

  const handleToggleStatus = async (item) => {
    const id = item.id_komponen || item.id;
    const updatedActive = !item.is_active;

    setData(prev => prev.map(d => (d.id_komponen === id || d.id === id) ? { ...d, is_active: updatedActive } : d));

    try {
      await updateKomponenTarif(id, {
        nama_komponen: item.nama_komponen,
        tipe_komponen: item.tipe_komponen || item.kategori,
        jenis_nilai: item.jenis_nilai,
        nilai: Number(item.nilai) || 0,
        is_active: updatedActive
      });
    } catch (err) {
      setData(prev => prev.map(d => (d.id_komponen === id || d.id === id) ? { ...d, is_active: !updatedActive } : d));
      Swal.fire('Gagal!', err.message || 'Gagal mengubah status komponen.', 'error');
    }
  };

  const handleOpenAddForm = () => {
    setEditingId(null);
    const defaultTipe = tipeKomponenOptions.length > 0 ? tipeKomponenOptions[0].value : '';

    setFormData({ 
      nama_komponen: '', 
      tipe_komponen: defaultTipe, 
      jenis_nilai: 'persen', 
      nilai: '', 
      is_active: true 
    });
    setViewMode('add');
  };

  const handleOpenEditForm = (item) => {
    const id = item.id_komponen || item.id;
    setEditingId(id);
    setFormData({ 
      nama_komponen: item.nama_komponen, 
      tipe_komponen: item.tipe_komponen || item.kategori || '', 
      jenis_nilai: item.jenis_nilai,
      nilai: item.nilai !== undefined ? item.nilai.toString() : '',
      is_active: Boolean(item.is_active)
    });
    setViewMode('edit');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setEditingId(null);
    setError(null);
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

  const formatRupiah = (val) => {
    const num = Number(val) || 0;
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const numericValue = formData.jenis_nilai === 'persen' 
      ? parseFloat(formData.nilai) || 0 
      : parseFormattedNumber(formData.nilai);

    const payload = {
      nama_komponen: formData.nama_komponen,
      tipe_komponen: formData.tipe_komponen,
      jenis_nilai: formData.jenis_nilai,
      nilai: numericValue,
      is_active: formData.is_active
    };

    try {
      if (editingId) {
        await updateKomponenTarif(editingId, payload);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data berhasil diperbarui!' });
      } else {
        await createKomponenTarif(payload);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data berhasil ditambahkan!' });
      }
      handleBackToList();
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message || 'Terjadi kesalahan' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleKategoriChange = (e) => {
    setSelectedKategori(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;

  const getTipeLabel = (val) => {
    const found = tipeKomponenOptions.find(opt => opt.value === val);
    return found ? found.label : val;
  };

  // ==========================================
  // FORM VIEW (ADD / EDIT)
  // ==========================================
  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="w-full pb-10">
        <div className="mb-6 border-b border-slate-200 pb-5">
          <nav className="flex items-center gap-2 text-sm mb-3" aria-label="Breadcrumb">
            <button
              onClick={handleBackToList}
              className="text-slate-500 hover:text-green-600 transition-colors cursor-pointer font-medium"
            >
              Master Komponen Tarif
            </button>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-800 font-semibold cursor-default">
              {viewMode === 'add' ? 'Create' : 'Edit'}
            </span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {viewMode === 'add' ? 'Tambah Komponen tarif' : 'Edit Komponen tarif'}
          </h1>
          <p className="text-slate-500 mt-1">
            {viewMode === 'add' ? 'Atur komponen tarif tambahan.' : 'Perbarui rincian komponen tarif yang dipilih.'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nama Komponen <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_komponen}
                  onChange={(e) => setFormData({ ...formData, nama_komponen: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all bg-slate-50/50"
                  placeholder="Contoh: Pajak PPN"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Tipe Komponen <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.tipe_komponen}
                  onChange={(e) => setFormData({ ...formData, tipe_komponen: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all bg-white"
                >
                  {loadingTipe ? (
                    <option value="">Memuat pilihan...</option>
                  ) : (
                    tipeKomponenOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Jenis Nilai <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.jenis_nilai}
                  onChange={(e) => setFormData({ ...formData, jenis_nilai: e.target.value, nilai: '' })}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all bg-white"
                >
                  <option value="persen">Persentase (%)</option>
                  <option value="nominal">Nominal (Rp)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nilai <span className="text-red-500">*</span>
                </label>
                {formData.jenis_nilai === 'persen' ? (
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.nilai}
                    onChange={(e) => setFormData({ ...formData, nilai: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all bg-slate-50/50"
                    placeholder="0"
                  />
                ) : (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                    <input
                      type="text"
                      required
                      value={formatDisplayNumber(formData.nilai)}
                      onChange={(e) => setFormData({ ...formData, nilai: e.target.value.replace(/[^0-9]/g, '') })}
                      className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all bg-slate-50/50"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                id="is_active"
                className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <label htmlFor="is_active" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                Aktifkan komponen ini
              </label>
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
                <FaSave className="text-xs" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Komponen'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // LIST VIEW
  // ==========================================
  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Master Komponen Tarif</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola komponen tarif tambahan.</p>
        </div>
        <button 
          onClick={handleOpenAddForm} 
          className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm shadow-green-600/20 transition-all cursor-pointer"
        >
          <FaPlus className="text-xs" />
          <span>Tambah Komponen</span>
        </button>
      </div>

      {/* --- FILTER & SEARCH BAR --- */}
      <div className="mb-5 flex flex-col md:flex-row gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Search Input */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 flex-grow">
          <FaSearch className="text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama komponen..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full bg-transparent outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Filter Dropdown Tipe/Kategori */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 md:w-56">
          <FaFilter className="text-slate-400 text-xs" />
          <select
            value={selectedKategori}
            onChange={handleKategoriChange}
            className="w-full bg-transparent outline-none cursor-pointer"
          >
            <option value="">Semua Tipe</option>
            {tipeKomponenOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Dropdown Status (Aktif/Nonaktif) */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 md:w-44">
          <FaFilter className="text-slate-400 text-xs" />
          <select
            value={selectedStatus}
            onChange={handleStatusChange}
            className="w-full bg-transparent outline-none cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="1">Aktif</option>
            <option value="0">Nonaktif</option>
          </select>
        </div>
      </div>

      {error && (<div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">{error}</div>)}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="p-10 text-center text-sm text-slate-500">Memuat data...</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3.5 w-12 text-center">No</th>
                  <th className="px-4 py-3.5">Nama Komponen</th>
                  <th className="px-4 py-3.5">Tipe</th>
                  <th className="px-4 py-3.5">Jenis Nilai</th>
                  <th className="px-4 py-3.5">Nilai</th>
                  <th className="px-4 py-3.5 text-center w-24">Status</th>
                  <th className="px-4 py-3.5 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length === 0 ? (
                  <tr><td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-400">Data tidak ditemukan.</td></tr>
                ) : (
                  filteredData.map((item, index) => {
                    const rowNumber = startIndex + index + 1;
                    const isActive = item.is_active === true || item.is_active === 1 || item.status === 1 || item.status === 'aktif';

                    return (
                      <tr key={item.id_komponen || item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3.5 text-center font-medium text-slate-400">{rowNumber}</td>
                        <td className="px-4 py-3.5 font-medium text-slate-900">{item.nama_komponen}</td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {getTipeLabel(item.tipe_komponen || item.kategori)}
                        </td>
                        <td className="px-4 py-3.5 capitalize text-slate-600">{item.jenis_nilai}</td>
                        <td className="px-4 py-3.5 text-slate-800 font-medium">
                          {item.jenis_nilai === 'persen' ? `${item.nilai}%` : formatRupiah(item.nilai)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => handleToggleStatus(item)} 
                              className={`p-1.5 rounded border transition-colors ${isActive ? 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100' : 'text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100'}`} 
                              title={isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            >
                              {isActive ? <FaToggleOn className="text-lg" /> : <FaToggleOff className="text-lg" />}
                            </button>
                            <button onClick={() => handleOpenEditForm(item)} className="p-1.5 text-slate-600 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 transition-colors" title="Edit"><FaEdit /></button>
                            <button onClick={() => handleDelete(item.id_komponen || item.id)} className="p-1.5 text-red-600 bg-red-50 border border-red-200/60 rounded hover:bg-red-100 transition-colors" title="Hapus"><FaTrash /></button>
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

        {!loading && filteredData.length > 0 && (
          <div className="border-t border-slate-200 bg-white px-4 py-3.5 sm:px-6">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMasterKomponenTarif;