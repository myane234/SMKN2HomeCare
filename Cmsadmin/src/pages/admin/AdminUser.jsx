import { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Pagination from '../../components/pagination';
import { getAllUsers, updateUserData, deleteUserData, toggleUserStatus } from '../../data/userData';
import Swal from 'sweetalert2';

export default function DataUser() {
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterGoldar, setFilterGoldar] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form State
  const [formNama, setFormNama] = useState('');
  const [formHp, setFormHp] = useState('');
  const [formNik, setFormNik] = useState('');
  const [formGoldar, setFormGoldar] = useState('');
  const [formGender, setFormGender] = useState('');
  const [formAlamat, setFormAlamat] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = () => {
    getAllUsers()
      .then((data) => {
        setUserList(data);
        setErrorMsg('');
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Gagal memuat data user');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      setLoading(true);
      fetchData();
    });
  }, []);

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setFormNama(user.nama_lengkap || '');
    setFormHp(user.no_hp || '');
    setFormNik(user.nik || '');
    setFormGoldar(user.golongan_darah || '');
    setFormGender(user.jenis_kelamin || '');
    setFormAlamat(user.alamat_utama || '');
    setFormActive(user.user?.is_active ?? true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const updateData = {
      nama_lengkap: formNama,
      no_hp: formHp,
      nik: formNik,
      golongan_darah: formGoldar || null,
      jenis_kelamin: formGender || null,
      alamat_utama: formAlamat,
      is_active: formActive ? 1 : 0
    };

    try {
      await updateUserData(selectedUser.id_pasien, updateData);
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data pasien diperbarui!' });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message || 'Gagal memperbarui data pasien' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (user) => {
    Swal.fire({
      title: 'Hapus Pasien?',
      text: `Anda yakin ingin menghapus data pasien ${user.nama_lengkap}? Tindakan ini akan menghapus data secara permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteUserData(user.id_pasien);
          Swal.fire('Terhapus!', 'Data pasien berhasil dihapus.', 'success');
          fetchData();
        } catch (err) {
          Swal.fire('Gagal!', err.message || 'Terjadi kesalahan saat menghapus data pasien.', 'error');
        }
      }
    });
  };

  const handleToggleStatusClick = async (user) => {
    const isActive = user.user?.is_active;
    const statusText = isActive ? 'menonaktifkan' : 'mengaktifkan';
    
    Swal.fire({
      title: 'Ubah Status Akun?',
      text: `Apakah Anda yakin ingin ${statusText} akun untuk pasien ${user.nama_lengkap}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Ubah!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Ganti dengan id_pasien karena route backend menargetkan data pasien
          await toggleUserStatus(user.id_pasien);
          Swal.fire('Berhasil!', 'Status akun berhasil diperbarui.', 'success');
          fetchData();
        } catch (err) {
          Swal.fire('Gagal!', err.message || 'Terjadi kesalahan saat mengubah status akun.', 'error');
        }
      }
    });
  };

  const filteredUsers = userList.filter((item) => {
    const matchesSearch = `${item.nama_lengkap} ${item.nik} ${item.no_hp} ${item.user?.email || ''}`
      .toLowerCase()
      .includes(search.toLowerCase());
      
    const matchesGender = filterGender === '' || item.jenis_kelamin === filterGender;
    const matchesGoldar = filterGoldar === '' || item.golongan_darah === filterGoldar;
    
    let matchesStatus = true;
    if (filterStatus !== '') {
      const isActive = item.user?.is_active ? '1' : '0';
      matchesStatus = isActive === filterStatus;
    }
    
    return matchesSearch && matchesGender && matchesGoldar && matchesStatus;
  });

  const totalPages = Math.max(Math.ceil(filteredUsers.length / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Master Data User</h1>
        <p className="page-subtitle">Kelola data pasien terdaftar, informasi medis, dan status aktif akun mereka.</p>
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
              placeholder="Cari nama, email, HP, atau NIK..."
              className="w-full bg-transparent outline-none"
            />
          </div>
          
          <select 
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
            value={filterGender}
            onChange={(e) => { setFilterGender(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Semua Gender</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
          
          <select 
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
            value={filterGoldar}
            onChange={(e) => { setFilterGoldar(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Semua Gol. Darah</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="AB">AB</option>
            <option value="O">O</option>
          </select>

          <select 
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
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
            <p className="p-10 text-center text-sm text-slate-500">Memuat data user...</p>
          ) : (
            <table className="w-full min-w-225 border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-4 py-3 text-left">Nama & Email</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left">NIK & No. HP</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-center">Gender</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-center">Gol. Darah</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left">Alamat Utama</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-center">Status Akun</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">
                      Tidak ada data user yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item) => (
                    <tr key={item.id_pasien} className="hover:bg-slate-50">
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 border border-slate-200">
                            {(item.nama_lengkap?.[0] || 'U').toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{item.nama_lengkap}</div>
                            <div className="text-xs text-slate-500">{item.user?.email || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm">
                        <div className="text-slate-800 font-medium">{item.nik || '-'}</div>
                        <div className="text-xs text-slate-500">{item.no_hp || '-'}</div>
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-center">
                        {item.jenis_kelamin === 'L' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">Laki-laki</span>
                        ) : item.jenis_kelamin === 'P' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-pink-50 text-pink-700">Perempuan</span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-center">
                        {item.golongan_darah ? (
                          <span className="inline-block w-8 py-0.5 text-center rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {item.golongan_darah}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm max-w-xs truncate" title={item.alamat_utama}>
                        {item.alamat_utama || <span className="text-slate-400 italic">Belum diatur</span>}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-center">
                        {item.user?.is_active ? (
                          <span className="badge badge-aktif">Aktif</span>
                        ) : (
                          <span className="badge badge-nonaktif">Nonaktif</span>
                        )}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3.5 text-sm text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Action Toggle Status */}
                          <button 
                            onClick={() => handleToggleStatusClick(item)} 
                            className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors inline-flex items-center gap-1 ${
                              item.user?.is_active 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' 
                                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                            }`}
                            title="Ubah Status Akun"
                          >
                            {item.user?.is_active ? <FaToggleOn className="text-emerald-600 text-sm" /> : <FaToggleOff className="text-slate-400 text-sm" />}
                            <span>{item.user?.is_active ? 'Aktif' : 'Nonaktif'}</span>
                          </button>

                          {/* Tombol Edit */}
                          <button 
                            onClick={() => handleEditClick(item)} 
                            className="p-1.5 text-slate-600 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 transition-colors"
                            title="Edit User"
                          >
                            <FaEdit />
                          </button>

                          {/* Tombol Hapus */}
                          <button 
                            onClick={() => handleDeleteClick(item)} 
                            className="p-1.5 text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                            title="Hapus User"
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
        
        {!loading && filteredUsers.length > 0 && (
          <div className="border-t border-slate-200 bg-white px-4 py-3.5 sm:px-6">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>

      {/* Modal Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl transform scale-100 transition-transform">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Edit Data User / Pasien</h3>
              <button onClick={handleModalClose} className="text-slate-400 hover:text-slate-600 font-semibold text-lg">&times;</button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="form-label">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required
                    className="form-input" 
                    value={formNama} 
                    onChange={(e) => setFormNama(e.target.value)} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">No. HP</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formHp} 
                      onChange={(e) => setFormHp(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="form-label">NIK (Nomor Induk Kependudukan)</label>
                    <input 
                      type="text" 
                      maxLength="16"
                      className="form-input" 
                      value={formNik} 
                      onChange={(e) => setFormNik(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Jenis Kelamin</label>
                    <select 
                      className="form-input" 
                      value={formGender} 
                      onChange={(e) => setFormGender(e.target.value)}
                    >
                      <option value="">Pilih Gender</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Golongan Darah</label>
                    <select 
                      className="form-input" 
                      value={formGoldar} 
                      onChange={(e) => setFormGoldar(e.target.value)}
                    >
                      <option value="">Pilih Golongan Darah</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Alamat Utama</label>
                  <textarea 
                    rows="3"
                    className="form-input" 
                    value={formAlamat} 
                    onChange={(e) => setFormAlamat(e.target.value)} 
                  />
                </div>

                <div className="flex items-center gap-3 mt-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <input 
                    type="checkbox" 
                    id="status-checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                    checked={formActive} 
                    onChange={(e) => setFormActive(e.target.checked)} 
                  />
                  <label htmlFor="status-checkbox" className="text-sm font-semibold text-slate-800 cursor-pointer">
                    Akun Aktif (Bisa login ke aplikasi)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={handleModalClose} className="btn-outline btn-sm">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary btn-sm">
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