import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaEdit, FaPlus } from 'react-icons/fa';
import { resolveImageUrl } from '../../utils/resolveImage.js';
import Pagination from '../../components/pagination';
import { getAllActiveNakes, getKategoriLayanan, updateNakesData, deleteNakesData } from '../../data/nakesData';
import { getAllWilayahLayanan } from '../../data/wilayahLayananData';
import Swal from 'sweetalert2';

export default function DataNakes() {
  const [nakesList, setNakesList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [wilayahList, setWilayahList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterWilayah, setFilterWilayah] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNakes, setSelectedNakes] = useState(null);
  const [formKategori, setFormKategori] = useState([]);
  const [formWilayah, setFormWilayah] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);  const fetchData = () => {
    setLoading(true);
    setErrorMsg('');
    Promise.all([
      getAllActiveNakes().catch(() => []),
      getKategoriLayanan().catch(() => []),
      getAllWilayahLayanan().catch(() => []),
    ])
      .then(([nakesData, kategoriData, masterWilayah]) => {
        setKategoriList(kategoriData);
        setWilayahList(masterWilayah);

        const mapped = nakesData.map((item) => {
          let kategoriArr = [];
          if (Array.isArray(item.kategori_layanan) && item.kategori_layanan.length > 0) {
            kategoriArr = item.kategori_layanan.map((k) => ({
              id_kategori_layanan: k.id_kategori_layanan || k.id,
              nama_kategori: k.nama_kategori || k.nama || k.name
            }));
          } else if (item.jenis_tenaga_medis) {
            const names = item.jenis_tenaga_medis.split(',').map(s => s.trim()).filter(Boolean);
            kategoriArr = names.map((name) => {
              const matchedKat = kategoriData.find(k => k.nama_kategori?.toLowerCase() === name.toLowerCase());
              return {
                id_kategori_layanan: matchedKat ? (matchedKat.id_kategori_layanan || matchedKat.id) : name,
                nama_kategori: name
              };
            });
          }

          let wilayahStr = '';
          let idWilayah = item.id_wilayah_layanan || item.id_wilayah || null;

          if (item.wilayah_layanan && typeof item.wilayah_layanan === 'object') {
            wilayahStr = item.wilayah_layanan.nama_wilayah || item.wilayah_layanan.nama_provinsi || item.wilayah_layanan.nama || '';
            if (!idWilayah) idWilayah = item.wilayah_layanan.id || item.wilayah_layanan.id_wilayah_layanan;
          } else if (typeof item.wilayah_layanan === 'string') {
            wilayahStr = item.wilayah_layanan;
          } else if (idWilayah) {
            const matchedW = masterWilayah.find(w => String(w.id || w.id_wilayah_layanan) === String(idWilayah));
            if (matchedW) wilayahStr = matchedW.nama_wilayah || matchedW.nama_provinsi || matchedW.nama || '';
          }

          if (!wilayahStr && item.alamat_lengkap) {
            wilayahStr = item.alamat_lengkap.split(',')[0];
          }

          // ID primer untuk update/delete di backend Laravel admin/nakes/{id}
          const primaryId = item.id_tenaga_medis ?? item.id_nakes ?? item.id ?? item.id_user ?? item.user_id;
          const rawFoto = item.foto_profile || item.foto || item.pasien?.foto_profile || item.user?.foto_profile;
          const resolvedFoto = resolveImageUrl(rawFoto) || '/nakesgambar.jpg';

          return {
            id: primaryId,
            id_tenaga_medis: item.id_tenaga_medis,
            id_user: item.id_user ?? item.user_id,
            rawItem: item,
            foto: resolvedFoto,
            nama: item.nama_lengkap ?? (item.pasien?.nama_lengkap || item.user?.name || item.user?.nama || ''),
            jenis: item.jenis_tenaga_medis ?? '',
            nomorStr: item.no_str ?? '',
            lulusan: item.lulusan ?? '',
            kategoriLayanan: kategoriArr,
            wilayahLayanan: wilayahStr,
            idWilayahLayanan: idWilayah
          };
        });

        setNakesList(mapped);
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Gagal memuat data');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (nakes) => {
    setSelectedNakes(nakes);
    setFormKategori(nakes.kategoriLayanan.map(k => k.id_kategori_layanan));
    setFormWilayah(nakes.idWilayahLayanan ? String(nakes.idWilayahLayanan) : '');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedNakes(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('_method', 'PUT');
    
    // Pastikan payload wilayah yang dikirim berupa ID (angka / ID wilayah)
    if (formWilayah) {
      formData.append('id_wilayah_layanan', formWilayah);
      formData.append('wilayah_layanan', formWilayah);
    }
    
    formKategori.forEach((katId, index) => {
      formData.append(`kategori_layanan[${index}]`, katId);
      formData.append(`jenis_tenaga_medis[]`, katId);
    });

    try {
      await updateNakesData(selectedNakes.id, formData);
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data Nakes diperbarui!' });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message || 'Gagal memperbarui data' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (nakes) => {
    Swal.fire({
      title: 'Hapus Tenaga Medis?',
      text: `Anda yakin ingin menghapus data nakes ${nakes.nama}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteNakesData(nakes.id);
          Swal.fire('Terhapus!', 'Data tenaga medis berhasil dihapus.', 'success');
          fetchData();
        } catch (err) {
          Swal.fire('Gagal!', err.message || 'Terjadi kesalahan saat menghapus data.', 'error');
        }
      }
    });
  };

  const toggleKategoriSelection = (katId) => {
    const exists = formKategori.some(id => String(id) === String(katId));
    if (exists) {
      setFormKategori(formKategori.filter(id => String(id) !== String(katId)));
    } else {
      setFormKategori([...formKategori, katId]);
    }
  };

  const filteredNakes = nakesList.filter((item) => {
    const matchesSearch = `${item.nama} ${item.jenis} ${item.nomorStr}`
      .toLowerCase()
      .includes(search.toLowerCase());
      
    const matchesKategori = filterKategori === '' || item.kategoriLayanan.some(k => 
      k.id_kategori_layanan.toString() === filterKategori || k.nama_kategori.toLowerCase().includes(filterKategori.toLowerCase())
    );
    
    const matchesWilayah = filterWilayah === '' || 
      (item.idWilayahLayanan && String(item.idWilayahLayanan) === filterWilayah) ||
      (item.wilayahLayanan && item.wilayahLayanan.toLowerCase().includes(filterWilayah.toLowerCase()));
    
    return matchesSearch && matchesKategori && matchesWilayah;
  });

  const totalPages = Math.max(Math.ceil(filteredNakes.length / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredNakes.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Data Nakes</h1>
          <p className="page-subtitle">Kelola data tenaga medis, kategori layanan, dan wilayah operasional.</p>
        </div>
        <Link 
          to="/nakes/pendaftaran" 
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <FaPlus className="text-xs" /> Tambah Nakes
        </Link>
      </div>

      {/* Filter Section */}
      <div className="mb-5 flex flex-col gap-4 rounded-card border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 flex-grow">
            <FaSearch />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Cari nama, jenis nakes, atau STR..."
              className="w-full bg-transparent outline-none"
            />
          </div>
          
          <select 
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
            value={filterKategori}
            onChange={(e) => { setFilterKategori(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Semua Kategori</option>
            {kategoriList.map(kat => (
              <option key={kat.id_kategori_layanan || kat.id} value={kat.id_kategori_layanan || kat.id}>
                {kat.nama_kategori || kat.nama}
              </option>
            ))}
          </select>
          
          <select 
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
            value={filterWilayah}
            onChange={(e) => { setFilterWilayah(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Semua Wilayah</option>
            {wilayahList.map(wil => {
              const wilId = wil.id || wil.id_wilayah_layanan;
              const wilLabel = wil.nama_wilayah || wil.nama_provinsi || wil.nama;
              return (
                <option key={wilId} value={wilId}>{wilLabel}</option>
              );
            })}
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
            <p className="p-10 text-center text-sm text-slate-500">Memuat data...</p>
          ) : (
            <table className="w-full min-w-225 border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-4 py-3 text-center w-12">No</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left">Nakes</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left">Kategori Layanan</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left">Wilayah Operasional</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-500">
                      Tidak ada data yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => {
                    const nomorUrut = (currentPage - 1) * itemsPerPage + index + 1;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-center font-medium text-slate-500">
                          {nomorUrut}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                          <div className="flex items-center gap-3">
                            <img 
                              src={item.foto} 
                              alt={item.nama} 
                              className="h-10 w-10 rounded-full object-cover bg-slate-200" 
                              onError={(e) => { e.target.onerror = null; e.target.src = '/nakesgambar.jpg'; }} 
                            />
                            <div>
                              <div className="font-semibold text-slate-900">{item.nama}</div>
                              <div className="text-xs text-slate-500">STR: {item.nomorStr}</div>
                            </div>
                          </div>
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {item.kategoriLayanan.length > 0 ? (
                              item.kategoriLayanan.map((k, idx) => (
                                <span key={idx} className="bg-primary-light text-primary-dark px-2 py-0.5 rounded text-xs font-medium">
                                  {k.nama_kategori}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 italic">Belum diatur</span>
                            )}
                          </div>
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                          {item.wilayahLayanan ? (
                            <span className="text-slate-800 font-medium">{item.wilayahLayanan}</span>
                          ) : (
                            <span className="text-slate-400 italic">Belum diatur</span>
                          )}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                          <div className="flex gap-2">
                            <button onClick={() => handleEditClick(item)} className="btn-outline btn-sm inline-flex items-center gap-2">
                              <FaEdit /> Edit
                            </button>
                            <button onClick={() => handleDeleteClick(item)} className="btn-danger btn-sm inline-flex items-center gap-2">
                              Hapus
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
        
        {!loading && filteredNakes.length > 0 && (
          <div className="border-t border-slate-200 bg-white px-4 py-3.5 sm:px-6">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>

      {/* Modal Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-slate-900">Edit Kategori & Wilayah</h3>
            <div className="mb-4 text-sm font-semibold text-slate-600">{selectedNakes?.nama}</div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">Wilayah Operasional</label>
                <select 
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-primary"
                  value={formWilayah}
                  onChange={(e) => setFormWilayah(e.target.value)}
                >
                  <option value="">Pilih Wilayah</option>
                  {wilayahList.map(wil => {
                    const wilId = wil.id || wil.id_wilayah_layanan;
                    const wilLabel = wil.nama_wilayah || wil.nama_provinsi || wil.nama;
                    return (
                      <option key={wilId} value={wilId}>{wilLabel}</option>
                    );
                  })}
                </select>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">Kategori Layanan (Bisa pilih lebih dari satu)</label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                  {kategoriList.map(kat => {
                    const katId = kat.id_kategori_layanan || kat.id;
                    return (
                      <div 
                        key={katId} 
                        onClick={() => toggleKategoriSelection(katId)}
                        className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                          formKategori.some(id => String(id) === String(katId)) 
                            ? 'border-primary bg-primary text-white font-medium' 
                            : 'border-slate-300 bg-white text-slate-600 hover:border-primary'
                        }`}
                      >
                        {kat.nama_kategori || kat.nama}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={handleModalClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}