import { useState, useEffect } from 'react';
import { FaSearch, FaEdit } from 'react-icons/fa';
import Pagination from '../../components/pagination';
import { getAllActiveNakes, getKategoriLayanan, updateNakesData, deleteNakesData } from '../../data/nakesData';
import { getImageUrl } from '../../data/imageHelper';
import Swal from 'sweetalert2';

const wilayahOptions = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi', 'Bengkulu', 'Sumatera Selatan', 'Kepulauan Bangka Belitung', 'Lampung',
  'DKI Jakarta', 'Jawa Barat', 'Banten', 'Jawa Tengah', 'Daerah Istimewa Yogyakarta', 'Jawa Timur',
  'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
  'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
  'Sulawesi Utara', 'Gorontalo', 'Sulawesi Tengah', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tenggara',
  'Maluku', 'Maluku Utara',
  'Papua', 'Papua Barat', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan', 'Papua Barat Daya'
];

export default function DataNakes() {
  const [nakesList, setNakesList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setErrorMsg('');
    Promise.all([getAllActiveNakes(), getKategoriLayanan()])
      .then(([nakesData, kategoriData]) => {
        setKategoriList(kategoriData);

        const mapped = nakesData.map((item) => {
          // 🔹 1. Parsing Kategori Layanan dari Response
          let kategoriArr = [];
          if (Array.isArray(item.kategori_layanan) && item.kategori_layanan.length > 0) {
            kategoriArr = item.kategori_layanan.map((k) => ({
              id_kategori_layanan: k.id_kategori_layanan,
              nama_kategori: k.nama_kategori
            }));
          } else if (item.jenis_tenaga_medis) {
            // Fallback jika kategori_layanan masih [] (misal: "Ibu dan Anak")
            const names = item.jenis_tenaga_medis.split(',').map(s => s.trim()).filter(Boolean);
            kategoriArr = names.map((name) => {
              const matchedKat = kategoriData.find(k => k.nama_kategori.toLowerCase() === name.toLowerCase());
              return {
                id_kategori_layanan: matchedKat ? matchedKat.id_kategori_layanan : name,
                nama_kategori: name
              };
            });
          }

          // 🔹 2. Parsing Wilayah Layanan
          let wilayahStr = '';
          if (item.wilayah_layanan && typeof item.wilayah_layanan === 'object') {
            wilayahStr = item.wilayah_layanan.nama_wilayah || item.wilayah_layanan.nama || '';
          } else if (typeof item.wilayah_layanan === 'string') {
            wilayahStr = item.wilayah_layanan;
          } else {
            wilayahStr = item.alamat_lengkap ? item.alamat_lengkap.split(',')[0] : '';
          }

          return {
            id: item.id_tenaga_medis ?? item.id,
            foto: item.foto_profile ?? '/nakesgambar.jpg',
            nama: item.nama_lengkap ?? (item.pasien?.nama_lengkap || ''),
            jenis: item.jenis_tenaga_medis ?? '',
            nomorStr: item.no_str ?? '',
            lulusan: item.lulusan ?? '',
            kategoriLayanan: kategoriArr,
            wilayahLayanan: wilayahStr,
            idWilayahLayanan: item.id_wilayah_layanan
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
    setFormWilayah(nakes.wilayahLayanan || '');
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
    if (formWilayah) formData.append('wilayah_layanan', formWilayah);
    
    formKategori.forEach((katId, index) => {
      formData.append(`kategori_layanan[${index}]`, katId);
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
    if (formKategori.includes(katId)) {
      setFormKategori(formKategori.filter(id => id !== katId));
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
    
    const matchesWilayah = filterWilayah === '' || (item.wilayahLayanan && item.wilayahLayanan.toLowerCase().includes(filterWilayah.toLowerCase()));
    
    return matchesSearch && matchesKategori && matchesWilayah;
  });

  const totalPages = Math.max(Math.ceil(filteredNakes.length / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredNakes.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Data Nakes</h1>
        <p className="page-subtitle">Kelola data tenaga medis, kategori layanan, dan wilayah operasional.</p>
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
              <option key={kat.id_kategori_layanan} value={kat.id_kategori_layanan}>{kat.nama_kategori}</option>
            ))}
          </select>
          
          <select 
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
            value={filterWilayah}
            onChange={(e) => { setFilterWilayah(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Semua Wilayah</option>
            {wilayahOptions.map(wil => (
              <option key={wil} value={wil}>{wil}</option>
            ))}
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
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Nakes</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Kategori Layanan</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Wilayah Operasional</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-sm text-slate-500">
                      Tidak ada data yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-200 px-4 py-3 text-sm">
                        <div className="flex items-center gap-3">
                          <img 
                            src={getImageUrl(item.foto)} 
                            alt={item.nama} 
                            className="h-10 w-10 rounded-full object-cover bg-slate-200" 
                            onError={(e) => e.target.src = '/nakesgambar.jpg'} 
                          />
                          <div>
                            <div className="font-semibold text-slate-900">{item.nama}</div>
                            <div className="text-xs text-slate-500">STR: {item.nomorStr}</div>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3 text-sm">
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
                      <td className="border-b border-slate-200 px-4 py-3 text-sm">
                        {item.wilayahLayanan ? (
                          <span className="text-slate-800 font-medium">{item.wilayahLayanan}</span>
                        ) : (
                          <span className="text-slate-400 italic">Belum diatur</span>
                        )}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3 text-sm">
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
                  ))
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
                  {wilayahOptions.map(wil => (
                    <option key={wil} value={wil}>{wil}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">Kategori Layanan (Bisa pilih lebih dari satu)</label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                  {kategoriList.map(kat => (
                    <div 
                      key={kat.id_kategori_layanan} 
                      onClick={() => toggleKategoriSelection(kat.id_kategori_layanan)}
                      className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        formKategori.includes(kat.id_kategori_layanan) 
                          ? 'border-primary bg-primary text-white font-medium' 
                          : 'border-slate-300 bg-white text-slate-600 hover:border-primary'
                      }`}
                    >
                      {kat.nama_kategori}
                    </div>
                  ))}
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